import ytrends.stats
import ytrends.mock

try:
    print("Creating mocks")
    stats = ytrends.stats.Stats("sqlite:///db/test.sqlite")
    mock = ytrends.mock.Mock()
    
    print("Checking viewable")
    assert stats.get_viewable() == mock.get_viewable()
    print("Passed")
    
    print("Checking day_count_by_country")
    assert stats.get_day_count_by_country() == mock.get_day_count_by_country()
    print("Passed")
    
    print("Checking couty_by_loc")
    assert stats.get_count_by_loc() == mock.get_count_by_loc()
    print("Passed")
except AssertionError:
    print("Assertion failed")