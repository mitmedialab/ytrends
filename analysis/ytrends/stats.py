import sqlalchemy

from ytrends.db import *

# init the connection to the database
engine = sqlalchemy.create_engine("sqlite:///db/development.sqlite3", echo=True)
Session = sqlalchemy.orm.sessionmaker(bind=engine)
session = Session()

def get_viewable():
    # Query ranks for all videos
    rows = session.query(Rank.video_id, Video.viewable).\
        filter(sqlalchemy.not_(Rank.loc.like('%all_%'))).\
        filter_by(source='view').\
        outerjoin(Video)
    viewable = {}
    for row in rows:
        viewable[row[0]] = row[1]
    return viewable

def get_day_count_by_country():
    # Query ranks for all days per country
    country_days = session.query(Rank.loc, sqlalchemy.sql.func.count(sqlalchemy.sql.func.distinct(Rank.date))).\
        filter(sqlalchemy.not_(Rank.loc.like('%all_%'))).\
        filter_by(source='view').\
        group_by(Rank.loc)
    day_count_by_country = {}
    for country_day in country_days:
        s = country_day[0]
        day_count_by_country[s] = country_day[1]
    return day_count_by_country

def get_count_by_loc():
    # Query ranks for all videos
    ranks = session.query(Rank.video_id, Rank.loc, sqlalchemy.sql.func.count('*').label('entries')).\
        filter(sqlalchemy.not_(Rank.loc.like('%all_%'))).\
        filter_by(source='view').\
        group_by(Rank.video_id, Rank.loc)
    
    # Create dict with counts (location -> video id -> count)
    count_by_loc = {}
    for rank in ranks:
        videos = count_by_loc.get(rank[1], {})
        videos[rank[0]] = rank[2]
        count_by_loc[rank[1]] = videos
    return count_by_loc
