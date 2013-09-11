class CreateVideosMigration < ActiveRecord::Migration
  def change
    create_table(:videos,:id=>false) do |t|
      t.string :id
      t.boolean :viewable
      t.string :title
      t.string :description
      t.string :category
      t.string :tags
			t.string :geo
      t.integer :duration
      t.integer :views
      t.decimal :rating
      t.date :published_date
      t.timestamps
    end
  end
end
