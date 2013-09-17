from __future__ import division

import math

import sqlalchemy

from ytrends.db import *

class Stats(object):
    '''
    Manage queries against our database (perhaps these methods should be on the models?)
    '''
    
    def __init__(self, url="sqlite:///db/development.sqlite3", logQueries=True):
        # init the connection to the database
        self.engine = sqlalchemy.create_engine(url, echo=logQueries)
        Session = sqlalchemy.orm.sessionmaker(bind=self.engine)
        self.session = Session()
    
    def get_viewable(self):
        '''
        Returns a dictionary that maps video_id to boolean indicating if it is viewable or not
        '''
        rows = self.session.query(Rank.video_id, Video.viewable).\
            filter(sqlalchemy.not_(Rank.loc.like('%all_%'))).\
            filter_by(source='view').\
            outerjoin(Video)
        viewable = {}
        for row in rows:
            viewable[row[0]] = row[1]
        return viewable
    
    def get_day_count_by_country(self):
        '''
        Returns a dictionary that maps location to number of days we have ranks about
        '''
        # Query ranks for all days per country
        country_days = self.session.query(Rank.loc, sqlalchemy.sql.func.count(sqlalchemy.sql.func.distinct(Rank.date))).\
            filter(sqlalchemy.not_(Rank.loc.like('%all_%'))).\
            filter_by(source='view').\
            group_by(Rank.loc)
        day_count_by_country = {}
        for country_day in country_days:
            s = country_day[0]
            day_count_by_country[s] = country_day[1]
        return day_count_by_country
    
    def get_count_by_loc(self):
        '''
        Returns a dictionary that maps location to a map of video_id to number of rankings (ie. days)
        '''
        # Query ranks for all videos
        ranks = self.session.query(Rank.video_id, Rank.loc, sqlalchemy.sql.func.count('*').label('entries')).\
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

    def get_videos(self):
        '''
        A set of all the videos we care about
        '''
        count_by_loc = self.get_count_by_loc()
        return set(video_id for by_vid in count_by_loc.values() for video_id in by_vid.keys())
    
    def get_locs(self):
        '''
        A set of all the locations we care about
        '''
        return set(self.get_count_by_loc().keys())
    
    def get_idf(self):
        '''
        ?
        '''
        count_by_loc = self.get_count_by_loc()
        videos = self.get_videos()
        locs = self.get_locs()
        return dict((video_id, math.log(len(locs) / sum([1 for l in locs if count_by_loc[l].get(video_id, 0) > 0]))) for video_id in videos)

    def get_video_popularity(self, video_id):
        '''
        Returns a dictionary for this specific video mapping country to number of days on top list
        '''
        ranks = self.session.query(Rank.loc, sqlalchemy.sql.func.count('*').label('entries')).\
            filter(sqlalchemy.not_(Rank.loc.like('%all_%'))).\
            filter_by(video_id=video_id).\
            filter_by(source='view').\
            group_by(Rank.loc)
        count_by_loc = {}
        for rank in ranks:
            count_by_loc[rank[0]] = rank[1]
        return count_by_loc
