#!/usr/bin/env ruby
require 'ytrends'

reporter = Ytrends::Reporter.new

reporter.graph_ml Date.yesterday, 'reports/yesterday.graphml'