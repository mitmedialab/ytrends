require 'logger'
require 'ytrends/rank'
require 'ytrends/graphml_writer'

class Ytrends::Reporter

  def initialize
    @log = Logger.new 'log/exporter.log'
  end

  def graph_ml date, output_file_name
    @log.info "Starting to export #{date} to GraphML"
    country_locs = Ytrends::country_locations

    graphml = Ytrends::GraphmlWriter.new
    graphml.undirected
    country_locs.each do |loc|
      graphml.add_node loc[:abbr], loc[:name]
    end
    
    ranks = Ytrends::Rank.only_countries.where(:date=>date).all

    country_locs.each_with_index do |source_loc, index|
      (index+1..country_locs.length-1).each do |target_index|
        target_loc = country_locs.at(target_index)
        source_ranks = select_ranks_by_loc ranks, source_loc[:abbr]
        target_ranks = select_ranks_by_loc ranks, target_loc[:abbr]
        common_count = score_common_ranks(source_ranks, target_ranks)
        graphml.add_edge(source_loc[:abbr], target_loc[:abbr], common_count)
      end
    end

    File.open(output_file_name, 'w') {|f| f.write(graphml.render)}
    @log.info "Done! Wrote output to #{output_file_name}"
  end

  private 
  
    def select_ranks_by_loc ranks, loc
      ranks.select { |r| r.loc==loc }
    end

    def score_common_ranks source_ranks, target_ranks
      source_video_ids = source_ranks.collect { |r| r.video_id }
      target_video_ids = target_ranks.collect { |r| r.video_id }
      (source_video_ids & target_video_ids).length
    end

end