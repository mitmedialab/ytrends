#!/usr/bin/env ruby
require 'ytrends'

reporter = Ytrends::Reporter.new

reporter.render_all({:weight => 0.3})
