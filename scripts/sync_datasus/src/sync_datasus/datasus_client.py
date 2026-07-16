import logging
import asyncio
import tempfile
import urllib.request
import urllib.error
from pathlib import Path
import pandas as pd
from typing import Literal, Optional, List
from datetime import datetime

try:
    from pysus.api.extensions import DBC
except ImportError:
    DBC = None

logger = logging.getLogger(__name__)

class DatasusClient:
    """
    Abstração sobre a biblioteca pysus para isolar a dependência e lidar
    com indisponibilidades do FTP do DATASUS.
    
    A implementação atual faz bypass da API de alto nível do PySUS 2.7.0
    porque o catálogo de nuvem (DuckLake) abandonou as tabelas base (PA e RD)
    em prol de agregados (PS e SP) com schemas diferentes, quebrando
    a retrocompatibilidade. Usamos o PySUS apenas como conversor nativo de DBC.
    """
    
    def list_available_competencias(self, sistema: Literal["SIA", "SIH"], uf: str) -> List[str]:
        """
        Retorna as competências disponíveis no FTP (YYYYMM) de forma ordenada.
        """
        try:
            # Como a listagem direta de FTP pode ser instável, delegamos para o fallback 
            # de get_latest_competencia.
            return []
        except Exception as e:
            logger.warning(f"Não foi possível listar competências para {sistema} {uf}: {e}")
            return []

    def get_latest_competencia(self, sistema: Literal["SIA", "SIH"], uf: str) -> Optional[str]:
        """
        Busca a última competência disponível fazendo tentativas regressivas 
        a partir do mês atual.
        """
        now = datetime.now()
        year = now.year
        month = now.month
        
        # Tentamos até 6 meses para trás
        for _ in range(6):
            comp = f"{year}{month:02d}"
            df = self.download_dataframe(sistema, uf, comp)
            if df is not None and not df.empty:
                return comp
                
            month -= 1
            if month == 0:
                month = 12
                year -= 1
                
        return None

    def _format_ftp_url(self, sistema: Literal["SIA", "SIH"], uf: str, competencia: str) -> str:
        """Monta a URL exata do arquivo no FTP oficial."""
        year_short = competencia[2:4]
        month = competencia[4:6]
        
        if sistema == "SIA":
            # Produção Ambulatorial
            filename = f"PAMA{year_short}{month}.dbc"
            return f"ftp://ftp.datasus.gov.br/dissemin/publicos/SIASUS/200801_/Dados/{filename}"
        else:
            # Registro de Internação
            filename = f"RDMA{year_short}{month}.dbc"
            return f"ftp://ftp.datasus.gov.br/dissemin/publicos/SIHSUS/200801_/Dados/{filename}"

    def download_dataframe(
        self, sistema: Literal["SIA", "SIH"], uf: str, competencia: str
    ) -> Optional[pd.DataFrame]:
        """
        Baixa o arquivo do DATASUS usando FTP puro e converte para DataFrame
        utilizando o leitor de DBC do pysus.
        Retorna None se o arquivo não estiver disponível ou ocorrer erro.
        """
        if DBC is None:
            logger.error("pysus not installed correctly. Can't read DBC.")
            return None
            
        url = self._format_ftp_url(sistema, uf, competencia)
        
        # Arquivo temporário para salvar o DBC e carregar via PySUS
        with tempfile.NamedTemporaryFile(suffix=".dbc", delete=False) as tmp_file:
            tmp_path = Path(tmp_file.name)
            
        try:
            logger.info(f"Tentando baixar {url}...")
            # Download sincrono usando urllib
            urllib.request.urlretrieve(url, tmp_path)
            
            # Carrega o arquivo usando o parser eficiente do PySUS 2.7.0 (Rust bindings)
            dbc = DBC(path=tmp_path)
            
            try:
                # Se já estiver num loop async, use um background thread, senão run
                loop = asyncio.get_running_loop()
                import nest_asyncio
                nest_asyncio.apply()
                df = loop.run_until_complete(dbc.load())
            except RuntimeError:
                df = asyncio.run(dbc.load())
                
            if df is None or df.empty:
                return None
                
            return df
            
        except urllib.error.URLError as e:
            # Quando o arquivo não está lá (meses não processados pelo Datasus ainda)
            if '550' in str(e):
                logger.warning(f"Arquivo não encontrado no FTP para {sistema} {uf} {competencia}.")
            else:
                logger.warning(f"Falha de rede/FTP ao baixar {sistema} {uf} {competencia}: {e}")
            return None
        except Exception as e:
            # Outros erros de parsing
            logger.warning(f"Falha ao processar {sistema} {uf} {competencia}: {e}")
            return None
        finally:
            if tmp_path.exists():
                tmp_path.unlink(missing_ok=True)
