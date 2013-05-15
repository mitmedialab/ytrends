require 'nokogiri'

class Ytrends::GraphmlWriter

  def initialize
    @nodes = []
    @edges = []
    @edgedefault = "directed"
  end

  def directed
    @edgedefault = "directed"
  end

  def undirected
    @edgedefault = "undirected"
  end

  # obj must have an 'id' attribute
  def add_node id, name='untitled'
    @nodes << { :id=>id, :name=>name }
  end

  def add_edge id1, id2, weight=nil
    @edges << { :source => id1, :target => id2, :weight => weight }
  end

  def render
    builder = Nokogiri::XML::Builder.new(:encoding => 'UTF-8') do |xml|
      xml.graphml('xmlns'=>'http://graphml.graphdrawing.org/xmlns',
                'xmlns:xsi'=>'http://www.w3.org/2001/XMLSchema-instance',
                'xsi:schemaLocation'=>'http://graphml.graphdrawing.org/xmlns http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd') {

        xml.graph(:id=>'commonalities', :edgedefault=>@edgedefault) {

          xml.key(:id=>'d0', :for=>'node', 'attr.name'=>'label', 'attr.type'=>'string'){
            xml.default {
              xml.cdata('untitled')
            }
          }
          xml.key(:id=>'d1', :for=>'edge', 'attr.name'=>'weight', 'attr.type'=>'double'){
            xml.default { xml.text('0') }
          }

          @nodes.each do |n|
            xml.node(:id=>n[:id]){
              xml.data(:key=>'d0') { xml.text(n[:name]) }
            }
          end

          @edges.each_with_index do |e,index|
            xml.edge(:id=>'e'+index.to_s, :source=>e[:source], :target=>e[:target]) {
              unless e[:weight].nil?
                xml.data(:key=>'d1') { xml.text(e[:weight]) }
              end
            }
          end

        }

      }
    end
    builder.to_xml
  end

end
