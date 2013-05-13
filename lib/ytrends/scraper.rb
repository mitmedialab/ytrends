require 'logger'
require 'sqlite3'
require 'open-uri'
require 'ytrends/rank'

class Ytrends::Scraper

  DEBUG_MODE = true

  def initialize
    @log = Logger.new 'log/scraper.log'
    @locations = Ytrends::locations
    #@db = Ytrends::db
  end

  def scrape_all_countries
    @log.info "Starting to scrape"
    @locations.each do |loc|
      next if loc.empty? # safety first!
      loc.strip!
      most_viewed_ids = most_viewed_rankings_for loc
      save_rankings_to_db loc, most_viewed_ids, 'view'
      most_shared_ids = most_shared_rankings_for loc
      save_rankings_to_db loc, most_shared_ids, 'share'
      @log.info '  saved: '+loc
      sleep 1 # be nice to them
    end
    @log.info 'Done!'
  end

  # turn the results from google into an ordered list of youtube video ids
  def parse_results content
    content.scan(/watch\?v=(.{11})/).flatten.uniq
  end

  private

    def save_rankings_to_db loc, video_ids, source
      video_ids.each_with_index do |video_id,index|
        ranking = Ytrends::Rank.new(
          :source => source,
          :loc => loc,
          :rank => index+1,
          :video_id => video_id,
          :date => Date.today
        )
        ranking.save
      end
    end

    def most_viewed_rankings_for loc
      content = open( most_viewed_url loc ).read
      video_ids = parse_results content
    end

    def most_shared_rankings_for loc
      content = open( most_shared_url loc ).read
      video_ids = parse_results content
    end

    def most_viewed_url loc
      "http://www.youtube.com/trendsdashboard_ajax?action_feed_videos=1&feed=views&loc="+loc+"&gender=--&age=--"
    end

    def most_shared_url loc
      "http://www.youtube.com/trendsdashboard_ajax?action_feed_videos=1&feed=shared&loc="+loc+"&gender=--&age=--"
    end

end
