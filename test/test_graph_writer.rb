require 'test/unit'
require 'ytrends'

class GraphWriter < Test::Unit::TestCase

  def setup
    @graph = Ytrends::GraphWriter.new
    @graph.undirected

  end

  def test_graphml
  end

  def test_json
  end

end
