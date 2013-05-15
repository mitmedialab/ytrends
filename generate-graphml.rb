#!/usr/bin/env ruby
require 'ytrends'

reporter = Ytrends::Reporter.new

reporter.graph_ml 'reports/connections.graphml'