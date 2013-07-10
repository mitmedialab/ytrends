require 'active_record'
require 'yaml'

class Ytrends

end

require 'ytrends/scraper.rb'

ActiveRecord::Base.logger = Logger.new(File.open('log/database.log', 'w'))
db_config = YAML.load_file('db/config.yml')
ActiveRecord::Base.establish_connection(db_config['development'])
