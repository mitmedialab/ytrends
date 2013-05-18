#!/usr/bin/env ruby
require 'ytrends'

reporter = Ytrends::Reporter.new

# passes in the weight threshold (ie. no edges with a common_pct less than this threshold are exported)
reporter.render_all({:weight => 0.3})
