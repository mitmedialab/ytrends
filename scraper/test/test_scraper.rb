require 'test/unit'
require 'ytrends'

class ScraperTest < Test::Unit::TestCase

  def setup
  end

  def test_parse_content
    test_content = File.open('test/example_location_content.html').read
    test_results = [
      'ZNM0ENUCO5I',
      'pQ4Rnba85o8',
      'CdJeZUrTo6g',
      'j8E1DeS_JzM',
      '_-eGXWQBhgU',
      '0EyfEDKWscg',
      'PKffm2uI4dk',
      'pfxB5ut-KTs',
      'nZcRU0Op5P4',
      'nrjp6e04dZ8'
    ]
    scraper = Ytrends::Scraper.new
    results = scraper.parse_results test_content
    assert_equal results.to_s, test_results.to_s
  end

end

