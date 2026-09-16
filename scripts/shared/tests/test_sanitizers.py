"""Testes unitários abrangentes para o módulo de sanitização e normalização scripts.shared.sanitizers."""

from decimal import Decimal
import pandas as pd
import pytest

from scripts.shared.sanitizers import (
    is_valid_sigtap_code,
    normalize_cnes,
    normalize_sigtap_code,
    parse_currency_to_decimal,
    safe_float_to_int,
    safe_int_str,
    safe_str,
    sanitize_cnpj,
    strip_accents,
    try_autocorrect_zero_prefix,
)


class TestSafeStr:
    """Testes para a função utilitária safe_str."""

    def test_safe_str_valid_strings(self):
        assert safe_str("  teste  ") == "teste"
        assert safe_str("texto simples") == "texto simples"

    def test_safe_str_numeric_and_types(self):
        assert safe_str(123) == "123"
        assert safe_str(45.67) == "45.67"

    def test_safe_str_nulls_and_empty(self):
        assert safe_str(None) is None
        assert safe_str("") is None
        assert safe_str("   ") is None
        assert safe_str(pd.NA) is None
        assert safe_str(float("nan")) is None


class TestSafeFloatToInt:
    """Testes para conversão segura de floats para inteiros."""

    def test_safe_float_to_int_valid(self):
        assert safe_float_to_int(10.0) == 10
        assert safe_float_to_int(10.9) == 10
        assert safe_float_to_int("42") == 42
        assert safe_float_to_int("42.0") == 42
        assert safe_float_to_int(100) == 100

    def test_safe_float_to_int_invalid_and_nulls(self):
        assert safe_float_to_int(None) is None
        assert safe_float_to_int("") is None
        assert safe_float_to_int(pd.NA) is None
        assert safe_float_to_int("abc") is None
        assert safe_float_to_int(float("nan")) is None


class TestSafeIntStr:
    """Testes para formatação segura de float como string inteira."""

    def test_safe_int_str_float_representations(self):
        assert safe_int_str(7.0) == "7"
        assert safe_int_str("7.0") == "7"
        assert safe_int_str(" 123.0 ") == "123"
        assert safe_int_str(123456) == "123456"

    def test_safe_int_str_nulls(self):
        assert safe_int_str(None) is None
        assert safe_int_str("") is None
        assert safe_int_str(pd.NA) is None
        assert safe_int_str(float("nan")) is None


class TestNormalizeCnes:
    """Testes para normalização escalar e vetorial de CNES (7 dígitos)."""

    def test_normalize_cnes_scalar_valid(self):
        assert normalize_cnes(123456) == "0123456"
        assert normalize_cnes("123456") == "0123456"
        assert normalize_cnes(1234567) == "1234567"
        assert normalize_cnes("1234567.0") == "1234567"
        assert normalize_cnes(1234567.0) == "1234567"
        assert normalize_cnes(" 996424 ") == "0996424"
        assert normalize_cnes("12.345-67") == "1234567"

    def test_normalize_cnes_scalar_invalid_and_nulls(self):
        assert normalize_cnes(None) is None
        assert normalize_cnes("") is None
        assert normalize_cnes("   ") is None
        assert normalize_cnes(pd.NA) is None
        assert normalize_cnes(float("nan")) is None
        assert normalize_cnes("abc") is None

    def test_normalize_cnes_vectorized(self):
        series = pd.Series([
            123456.0,
            "7654321",
            "996424.0",
            None,
            pd.NA,
            float("nan"),
            "",
            "12.345-67",
        ])
        result = normalize_cnes(series)
        assert isinstance(result, pd.Series)
        assert result.iloc[0] == "0123456"
        assert result.iloc[1] == "7654321"
        assert result.iloc[2] == "0996424"
        assert result.iloc[3] is None
        assert result.iloc[4] is None
        assert result.iloc[5] is None
        assert result.iloc[6] is None
        assert result.iloc[7] == "1234567"


class TestNormalizeSigtapCode:
    """Testes para normalização escalar e vetorial de códigos SIGTAP (10 dígitos)."""

    def test_normalize_sigtap_code_scalar_valid(self):
        assert normalize_sigtap_code(301010158) == "0301010158"
        assert normalize_sigtap_code("301010158") == "0301010158"
        assert normalize_sigtap_code("301010158.0") == "0301010158"
        assert normalize_sigtap_code(301010158.0) == "0301010158"
        assert normalize_sigtap_code("0301010158") == "0301010158"
        assert normalize_sigtap_code(" 0301010158 ") == "0301010158"

    def test_normalize_sigtap_code_scalar_nulls(self):
        assert normalize_sigtap_code(None) is None
        assert normalize_sigtap_code("") is None
        assert normalize_sigtap_code("   ") is None
        assert normalize_sigtap_code(pd.NA) is None
        assert normalize_sigtap_code(float("nan")) is None
        assert normalize_sigtap_code("abc") is None

    def test_normalize_sigtap_code_vectorized(self):
        series = pd.Series([
            301010158.0,
            "0301010158",
            "202010120",
            None,
            pd.NA,
            float("nan"),
            "",
        ])
        result = normalize_sigtap_code(series)
        assert isinstance(result, pd.Series)
        assert result.iloc[0] == "0301010158"
        assert result.iloc[1] == "0301010158"
        assert result.iloc[2] == "0202010120"
        assert result.iloc[3] is None
        assert result.iloc[4] is None
        assert result.iloc[5] is None
        assert result.iloc[6] is None


class TestParseCurrencyToDecimal:
    """Testes para conversão de valores monetários para Decimal."""

    def test_parse_currency_brazilian_format(self):
        assert parse_currency_to_decimal("R$ 1.234,56") == Decimal("1234.56")
        assert parse_currency_to_decimal("1.234,56") == Decimal("1234.56")
        assert parse_currency_to_decimal("R$ 50,00") == Decimal("50.00")
        assert parse_currency_to_decimal("1500,50") == Decimal("1500.50")

    def test_parse_currency_international_format(self):
        assert parse_currency_to_decimal("1234.56") == Decimal("1234.56")
        assert parse_currency_to_decimal("   123.45  ") == Decimal("123.45")

    def test_parse_currency_numbers(self):
        assert parse_currency_to_decimal(1234.56) == Decimal("1234.56")
        assert parse_currency_to_decimal(100) == Decimal("100.00")
        assert parse_currency_to_decimal(Decimal("99.99")) == Decimal("99.99")

    def test_parse_currency_nulls_and_invalids(self):
        assert parse_currency_to_decimal(None) is None
        assert parse_currency_to_decimal("") is None
        assert parse_currency_to_decimal("   ") is None
        assert parse_currency_to_decimal(pd.NA) is None
        assert parse_currency_to_decimal(float("nan")) is None
        assert parse_currency_to_decimal("invalido") is None


class TestSanitizeCnpj:
    """Testes para higienização e preenchimento de CNPJ."""

    def test_sanitize_cnpj_valid(self):
        assert sanitize_cnpj("12.345.678/0001-90") == "12345678000190"
        assert sanitize_cnpj("12345678000190") == "12345678000190"
        assert sanitize_cnpj("345678000190") == "00345678000190"

    def test_sanitize_cnpj_nulls(self):
        assert sanitize_cnpj(None) is None
        assert sanitize_cnpj("") is None
        assert sanitize_cnpj(pd.NA) is None
        assert sanitize_cnpj("abc") is None


class TestSigtapValidationAndCorrections:
    """Testes para utilitários de validação e correção de códigos SIGTAP."""

    def test_is_valid_sigtap_code(self):
        assert is_valid_sigtap_code("0301010158") is True
        assert is_valid_sigtap_code("301010158") is False  # 9 dígitos
        assert is_valid_sigtap_code("03010101580") is False  # 11 dígitos
        assert is_valid_sigtap_code("030101015A") is False  # não numérico
        assert is_valid_sigtap_code("") is False
        assert is_valid_sigtap_code(None) is False

    def test_try_autocorrect_zero_prefix(self):
        assert try_autocorrect_zero_prefix("301010158") == "0301010158"
        assert try_autocorrect_zero_prefix("0301010158") is None  # Já tem 10 dígitos
        assert try_autocorrect_zero_prefix("030101015") is None  # Começa com zero
        assert try_autocorrect_zero_prefix("abc123456") is None
        assert try_autocorrect_zero_prefix(None) is None

    def test_strip_accents(self):
        assert strip_accents("Atenção Básica e Média Complexidade") == "Atencao Basica e Media Complexidade"
        assert strip_accents("São João d'Aliança") == "Sao Joao d'Alianca"
        assert strip_accents("ACRÉSCIMO, SUPRESSÃO") == "ACRESCIMO, SUPRESSAO"
