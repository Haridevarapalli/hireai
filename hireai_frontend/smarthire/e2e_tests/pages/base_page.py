from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

class BasePage:
    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(self.driver, 10)

    def go_to(self, url):
        self.driver.get(url)

    def get_title(self):
        return self.driver.title

    def find_element(self, by, value):
        return self.wait.until(EC.presence_of_element_located((by, value)))

    def click(self, by, value):
        element = self.wait.until(EC.element_to_be_clickable((by, value)))
        element.click()

    def send_keys(self, by, value, keys):
        element = self.wait.until(EC.presence_of_element_located((by, value)))
        element.clear()
        element.send_keys(keys)
        
    def wait_for_url_contains(self, text):
        try:
            self.wait.until(EC.url_contains(text))
            return True
        except TimeoutException:
            return False
