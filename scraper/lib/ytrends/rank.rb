class Ytrends::Rank < ActiveRecord::Base

  def self.only_countries
    where('loc NOT LIKE ?','all%')
  end

  def self.only_us_states
    where('loc LIKE ?','all%')
  end

end