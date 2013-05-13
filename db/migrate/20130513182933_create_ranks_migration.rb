class CreateRanksMigration < ActiveRecord::Migration
  def change
    create_table :ranks do |t|
      t.string :source
      t.string :loc
      t.integer :rank
      t.string :video_id
      t.date :date
      t.timestamps
    end
  end
end