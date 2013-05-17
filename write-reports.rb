#!/usr/bin/env ruby
require 'ytrends'

reporter = Ytrends::Reporter.new

reporter.render_all
