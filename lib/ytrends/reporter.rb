require 'logger'
require 'ytrends/rank'
require 'ytrends/graph_writer'

class Ytrends::Reporter

  def initialize
    @log = Logger.new 'log/reporter.log'
  end

  def render_all thresholds
    output_file_name = "reports/connections"
    @log.info "Starting to report to GraphML"
    country_locs = Ytrends::country_locations

    graph = Ytrends::GraphWriter.new
    graph.undirected
    country_locs.each do |loc|
      graph.add_node loc[:abbr], {'name'=>loc[:name]}
    end
    
    ranks = Ytrends::Rank.only_countries.all

    country_locs.each_with_index do |source_loc, index|
      (index+1..country_locs.length-1).each do |target_index|
        target_loc = country_locs.at target_index
        source_ranks = select_ranks_by_loc ranks, source_loc[:abbr]
        target_ranks = select_ranks_by_loc ranks, target_loc[:abbr]
        common_pct = common_video_pct(source_ranks, target_ranks)
        common_video_ids = common_videos(source_ranks, target_ranks)
      
        output_edge = true
        output_edge = false if thresholds.include? :weight and common_pct < thresholds[:weight]

        if output_edge
          graph.add_edge(source_loc[:abbr], target_loc[:abbr], 
            {:weight=>common_pct, :pct=>common_pct, :count=> common_video_ids.length, :video_ids=>common_video_ids.join(",")}
          )
        end
        
      end
    end

    File.open(output_file_name+".json", 'w') {|f| f.write(graph.render_to_json)}
    #File.open(output_file_name+".graphml", 'w') {|f| f.write(graph.render_to_graphml)}
    @log.info "Done! Wrote output to reports dir"
  end

  private 
  
    def select_ranks_by_loc ranks, loc
      ranks.select { |r| r.loc==loc }
    end

    def common_videos source_ranks, target_ranks
      source_video_ids = source_ranks.collect { |r| r.video_id }
      target_video_ids = target_ranks.collect { |r| r.video_id }
      source_video_ids.uniq & target_video_ids.uniq
    end

    def common_video_pct source_ranks, target_ranks
      return 0 if (source_ranks.length+source_ranks.length)==0
      source_video_ids = (source_ranks.collect { |r| r.video_id })
      target_video_ids = (target_ranks.collect { |r| r.video_id })
      common_ids = common_videos source_ranks, target_ranks
      common_count = (common_ids.collect do |video_id|
        source_video_ids.count(video_id) + target_video_ids.count(video_id)
      end).sum
      common_count.to_f / (source_video_ids.length+target_video_ids.length).to_f
    end

end