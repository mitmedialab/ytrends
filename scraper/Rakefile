require 'rake/testtask'
require 'standalone_migrations'

StandaloneMigrations::Tasks.load_tasks

Rake::TestTask.new do |t|
  t.libs << 'test'
end

desc "Run tests"
task :default => :test
