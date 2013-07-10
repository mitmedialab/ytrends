from sqlalchemy import Column, Integer, String, Date
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Rank(Base):
    __tablename__ = 'ranks'
    id = Column(Integer, primary_key=True)
    source =  Column(String)
    loc = Column(String)
    rank = Column(Integer)
    video_id = Column(String)
    date = Column(Date)

    def __repr__(self):
        return '<Rank "%s" (%d)>' % (self.video_id, self.rank)

#    def self.only_countries
#        where('loc NOT LIKE ?','all%')
  
#    def self.only_us_states
#        where('loc LIKE ?','all%')
