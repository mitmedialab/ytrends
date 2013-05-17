require 'nokogiri'
require 'json'

# tailored for import into gephi
class Ytrends::GraphWriter

  def initialize
    @nodes = []
    @edges = []
    @edgedefault = "directed"
    @node_attributes = {}   # name to type
    @edge_attributes = {}   # name to type
  end

  def directed
    @edgedefault = "directed"
  end

  def undirected
    @edgedefault = "undirected"
  end

  # obj must have an 'id' attribute
  def add_node id, attributes={}
    attributes.each_pair do |key, value|
      if not @node_attributes.has_key? key
        @node_attributes[key] = value.class
      end
    end
    @nodes << attributes.merge({ :id=>id }  )
  end

  def add_edge id1, id2, attributes={}
    attributes.each_pair do |key, value|
      if not @edge_attributes.has_key? key
        @edge_attributes[key] = value.class
      end
    end
    @edges << attributes.merge( { :source => id1, :target => id2 } )
  end

  def render_to_json
    obj = {
      :nodes=>[],
      :links=>[]
    }
    @nodes.each_with_index do |n,idx|
      obj[:nodes] << {:idx=>idx}.merge(n)
    end
    @edges.each_with_index do |e, index|
      obj[:links] << e.merge({
        :source => @nodes.find_index { |n| n[:id]==e[:source] },
        :target => @nodes.find_index { |n| n[:id]==e[:target] },
      })
    end
    obj.to_json
  end

  def render_to_graphml
   builder = Nokogiri::XML::Builder.new(:encoding => 'UTF-8') do |xml|
      xml.graphml('xmlns'=>'http://graphml.graphdrawing.org/xmlns',
                'xmlns:xsi'=>'http://www.w3.org/2001/XMLSchema-instance',
                'xsi:schemaLocation'=>'http://graphml.graphdrawing.org/xmlns http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd') {

        xml.graph(:id=>'commonalities', :edgedefault=>@edgedefault) {

          # name all the node attributes
          @node_attributes.keys.sort.each_with_index do |attr_name,idx|
            ruby_classname = @node_attributes[attr_name]
            xml.key(:id=>'na'+idx.to_s, :for=>'node', 'attr.name'=>attr_name, 'attr.type'=>ruby_class_to_graphml_type(ruby_classname)){
              xml.default {
                xml.text ruby_class_to_graphml_default(ruby_classname) 
              }
            }
          end

          # name all the edge attributes
          @edge_attributes.keys.sort.each_with_index do |attr_name,idx|
            ruby_classname = @edge_attributes[attr_name]
            xml.key(:id=>'ea'+idx.to_s, :for=>'edge', 'attr.name'=>attr_name, 'attr.type'=>ruby_class_to_graphml_type(ruby_classname)){
              xml.default {
                xml.text ruby_class_to_graphml_default(ruby_classname) 
              }
            }
          end

          @nodes.each do |n|
            xml.node(:id=>n[:id]){
              @node_attributes.keys.sort.each_with_index do |attr_name,idx|
                xml.data(:key=>'na'+idx.to_s) { xml.text(n[attr_name]) } if n.has_key? attr_name
              end
            }
          end

          @edges.each_with_index do |e,index|
            xml.edge(:id=>'ea'+index.to_s, :source=>e[:source], :target=>e[:target]) {
              @edge_attributes.keys.sort.each_with_index do |attr_name, idx|
                xml.data(:key=>'ea'+idx.to_s) { xml.text(e[attr_name]) } if e.has_key? attr_name
              end
            }
          end

        }

      }
    end
    builder.to_xml
  end

  private

    def ruby_class_to_graphml_default ruby_classname
      {
        'Fixnum'=>0,
        'Float'=>0.0,
        'String'=>"untitled"
      }[ruby_classname.to_s]
    end

    def ruby_class_to_graphml_type ruby_classname
      {
        'Fixnum'=>'double',
        'Float'=>'double',
        'String'=>'string'
      }[ruby_classname.to_s]
    end

end
