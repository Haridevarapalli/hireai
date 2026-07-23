from selenium.webdriver.common.by import By
from .base_page import BasePage

class HomePage(BasePage):
    # Example Locators - update these according to the actual app DOM
    LOGIN_LINK = (By.XPATH, "//a[contains(text(), 'Login')]")
    JOB_BOARD_LINK = (By.XPATH, "//a[contains(text(), 'Jobs')]")
    
    def __init__(self, driver):
        super().__init__(driver)
        
    def navigate_to(self, base_url):
        self.go_to(base_url)
        
    def go_to_login(self):
        try:
            self.click(*self.LOGIN_LINK)
            return True
        except:
            return False
