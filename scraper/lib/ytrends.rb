require 'active_record'
require 'yaml'

class Ytrends

LOCATIONS_CSV_PATH = 'lib/ytrends/data/locations.txt'
  @@locations = nil

	# caches static list of locations so they're only read in from disk once
	def self.locations
    if @@locations.nil?
      @@locations = []
      File.open(Ytrends::LOCATIONS_CSV_PATH).each_line do |line|
        line_parts = line.split("|")
        @@locations << {
          :abbr=>line_parts[0].strip,
          :name=>line_parts[1].strip
        }
      end
    end
    @@locations
  end

  def self.country_locations
    self.locations.select { |loc| not loc[:abbr].start_with? 'all_' }
	end

end

require 'ytrends/scraper.rb'

ActiveRecord::Base.logger = Logger.new(File.open('log/database.log', 'w'))
db_config = YAML.load_file('db/config.yml')
ActiveRecord::Base.establish_connection(db_config['development'])
