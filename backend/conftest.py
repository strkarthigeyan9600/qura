"""Isolate the entire backend test session before application imports."""
import os
import tempfile
import pytest

TEST_DIRECTORY = tempfile.TemporaryDirectory(prefix='qura-tests-')
os.environ['QURA_STORAGE_DIR'] = TEST_DIRECTORY.name
os.environ['QURA_JWT_SECRET'] = 'test-only-secret-not-used-outside-isolated-tests-2026'
os.environ['QURA_TESTING'] = '1'

@pytest.fixture(scope='session', autouse=True)
def isolated_storage():
    """Delete only the isolated temporary test storage after the suite."""
    yield TEST_DIRECTORY.name
    TEST_DIRECTORY.cleanup()
