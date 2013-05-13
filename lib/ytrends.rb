require 'active_record'
require 'yaml'

class Ytrends

  LOCATIONS_CSV_PATH = 'lib/ytrends/data/locations.txt'
  @@locations = nil

  # caches static list of locations so they're only read in from disk once
  def self.locations
    @@locations = File.readlines(Ytrends::LOCATIONS_CSV_PATH) if @@locations==nil
    @@locations
  end

end

require 'ytrends/scraper.rb'

ActiveRecord::Base.logger = Logger.new(File.open('log/database.log', 'w'))
db_config = YAML.load_file('db/config.yml')
ActiveRecord::Base.establish_connection(db_config['development'])
