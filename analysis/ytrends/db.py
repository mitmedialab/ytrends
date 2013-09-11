from sqlalchemy import Column, Integer, String, Date, Boolean, Numeric, UnicodeText, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship, backref

Base = declarative_base()

class Rank(Base):
    __tablename__ = 'ranks'
    id = Column(Integer, primary_key=True)
    source =  Column(String)
    loc = Column(String)
    rank = Column(Integer)
    video_id = Column(String, ForeignKey('videos.id'))
    date = Column(Date)

    video = relationship("Video", backref=backref('ranks', order_by=id))

    def __repr__(self):
        return '<Rank "%s" (%d)>' % (self.video_id, self.rank)

#    def self.only_countries
#        where('loc NOT LIKE ?','all%')
  
#    def self.only_us_states
#        where('loc LIKE ?','all%')

class Video(Base):
    __tablename__ = 'videos'
    id = Column(String, primary_key=True)
    viewable = Column(Boolean)
    title =  Column(UnicodeText)
    description = Column(UnicodeText)
    category = Column(UnicodeText)
    tags = Column(UnicodeText)
    geo = Column(UnicodeText)
    duration = Column(Integer)
    views = Column(Integer)
    rating = Column(Numeric)
    published_date = Column(DateTime)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    def __repr__(self):
        return '<Video %s - "%s">' % (self.id, self.description)
