class AddKeysMigration < ActiveRecord::Migration
  def change
  	add_index :ranks, :source
  	add_index :ranks, :loc
  	add_index :ranks, :video_id
  	add_index :videos, :id, :unique=>true
  end
end
