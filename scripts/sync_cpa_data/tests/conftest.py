"""Shared pytest fixtures for sync_cpa_data tests."""

import pandas as pd
import pytest


@pytest.fixture()
def sample_instituicoes_df() -> pd.DataFrame:
    """Minimal valid raw DataFrame mimicking the INSTITUICOES sheet."""
    return pd.DataFrame(
        {
            "ESTABELECIMENTO": ["Hospital A", "Clínica B"],
            "CNES": ["1234567", "9876543"],
            "CNPJ": ["12.345.678/0001-90", "98765432000199"],
            "TIPO DE INSTITUIÇÃO": ["FILANTRÓPICO", "EMPRESA"],
        }
    )


@pytest.fixture()
def sample_vinculos_df() -> pd.DataFrame:
    """Minimal valid raw DataFrame mimicking the VINCULOS sheet."""
    return pd.DataFrame(
        {
            "CNES": ["1234567", "9876543"],
            "NUMERO DO VINCULO": ["CONV-001", "CONT-002"],
            "NUMERO DO PROCESSO ORIGINAL": ["SEI-001", "SEI-002"],
            "TIPO DO VINCULO": ["CONVÊNIO", "CONTRATO"],
            "OBJETO": ["Prestação de serviços", "Manutenção"],
            "COMPLEXIDADE": ["AC, MC", "BC"],
            "VALOR DO DOCUMENTO ORIGINAL (ANUAL)": ["1.200.000,00", "850000,50"],
            "DATA DA ASSINATURA": ["01/03/2024", "15/06/2023"],
            "DATA DE INÍCIO": ["01/04/2024", "01/07/2023"],
            # float('nan') mirrors what pandas produces for an empty cell with dtype=str
            "DATA DE FINALIZAÇÃO": ["31/03/2025", float("nan")],
        }
    )
