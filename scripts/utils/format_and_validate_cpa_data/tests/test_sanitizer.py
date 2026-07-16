from format_and_validate_cpa_data.sanitizer import sanitize_code, is_valid_sigtap_code, try_autocorrect_zero_prefix, try_extract_sigtap_prefix, sanitize_cnpj

def test_sanitize_code_removes_spaces():
    assert sanitize_code(" 12345 ") == "12345"
    assert sanitize_code("12 345") == "12345"

def test_sanitize_code_removes_non_numeric():
    assert sanitize_code("12.345-6") == "123456"
    assert sanitize_code("abc123def4") == "1234"
    assert sanitize_code("!@12#3$4") == "1234"

def test_sanitize_code_handles_non_strings():
    assert sanitize_code(12345) == "12345"
    assert sanitize_code(12.34) == "12" # truncates due to int()
    assert sanitize_code(None) == ""

def test_sanitize_code_handles_floats_correctly():
    assert sanitize_code(202010163.0) == "202010163"   # fix do bug: sem o 0 extra do .0
    assert sanitize_code(20201076725.0) == "20201076725"

def test_is_valid_sigtap_code():
    assert is_valid_sigtap_code("1234567890") is True
    assert is_valid_sigtap_code("123456789") is False
    assert is_valid_sigtap_code("12345678901") is False
    assert is_valid_sigtap_code("123456789a") is False
    assert is_valid_sigtap_code(" 1234567890 ") is False # assumes already sanitized

def test_try_autocorrect_zero_prefix():
    # Caso ideal: 9 dígitos, não começa com 0
    assert try_autocorrect_zero_prefix("202010023") == "0202010023"
    
    # 9 dígitos mas já começa com 0 (não seria válido no SIGTAP mas foge da regra do zero omitido)
    assert try_autocorrect_zero_prefix("020201002") is None
    
    # Já tem 10 dígitos
    assert try_autocorrect_zero_prefix("0202010023") is None
    
    # Menos de 9 dígitos
    assert try_autocorrect_zero_prefix("12345678") is None
    
    # 9 caracteres mas não numéricos
    assert try_autocorrect_zero_prefix("202a10023") is None

def test_try_extract_sigtap_prefix():
    assert try_extract_sigtap_prefix("020201076725") == "020201076"
    assert try_extract_sigtap_prefix("0202031217125") == "020203121"
    assert try_extract_sigtap_prefix("0202010163") is None  # 10 dígitos, não se aplica
    assert try_extract_sigtap_prefix("020201002") is None   # 9 dígitos, não se aplica

def test_sanitize_cnpj():
    assert sanitize_cnpj("008195760001 85") == "00819576000185"
    assert sanitize_cnpj("06.048.565/0001-25") == "06048565000125"
    assert sanitize_cnpj("12345") == "00000000012345"
    assert sanitize_cnpj(None) == ""
    assert sanitize_cnpj("") == ""
