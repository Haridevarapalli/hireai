import os
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from dotenv import load_dotenv

load_dotenv()

@pytest.fixture(scope="session")
def base_url():
    url = os.getenv("BASE_URL", "http://localhost:3000")
    if not url.endswith("/"):
        url += "/"
    return url

@pytest.fixture(scope="function")
def driver(request):
    chrome_options = Options()
    # Required for headless mode in CI
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")

    driver = webdriver.Chrome(options=chrome_options)
    driver.implicitly_wait(10)
    
    yield driver
    
    # Take screenshot on failure
    if request.node.rep_call.failed:
        # Make screenshots directory if it doesn't exist
        os.makedirs("Test Results/Screenshots", exist_ok=True)
        driver.save_screenshot(f"Test Results/Screenshots/{request.node.name}.png")
        
    driver.quit()

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep = outcome.get_result()
    setattr(item, "rep_" + rep.when, rep)
