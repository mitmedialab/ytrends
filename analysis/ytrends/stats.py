from __future__ import division

import math

import sqlalchemy

from ytrends.db import *

# For checking mysql connection freshness, see:
# http://stackoverflow.com/questions/18054224/python-sqlalchemy-mysql-server-has-gone-away
def checkout_listener(dbapi_con, con_record, con_proxy):
    try:
        try:
            dbapi_con.ping(False)
        except TypeError:
            dbapi_con.ping()
    except dbapi_con.OperationalError as exc:
        if exc.args[0] in (2006, 2013, 2014, 2045, 2055):
            raise sqlalchemy.exc.DisconnectionError()
        else:
            raise

class Stats(object):
    '''
    Manage queries against our database (perhaps these methods should be on the models?)
    '''
    
    def __init__(self, url, logQueries=True):
        # init the connection to the database
        self.engine = sqlalchemy.create_engine(url, echo=logQueries)
        sqlalchemy.event.listen(self.engine, 'checkout', checkout_listener)
        Session = sqlalchemy.orm.sessionmaker(bind=self.engine)
        self.session = Session()
        
    
    def clean_loc(self, loc):
        if loc == '--':
            return 'usa'
        return loc
    
    def get_viewable(self):
        '''
        Returns a dictionary that maps video_id to boolean indicating if it is viewable or not
        '''
        try:
            return self.viewable
        except AttributeError:
            pass
        # Query ranks for all videos
        rows = self.session.query(Rank.video_id, Video.viewable).\
            filter(sqlalchemy.not_(Rank.loc.like('%all_%'))).\
            filter_by(source='view').\
            outerjoin(Video)
        self.viewable = {}
        for row in rows:
            self.viewable[row[0]] = row[1]
        return self.viewable
    
    def get_day_count_by_country(self):
        '''
        Returns a dictionary that maps location to number of days we have ranks about
        '''
        try:
            return self.day_count_by_country
        except AttributeError:
            pass
        # Query ranks for all days per country
        country_days = self.session.query(Rank.loc, sqlalchemy.sql.func.count(sqlalchemy.sql.func.distinct(Rank.date))).\
            filter(sqlalchemy.not_(Rank.loc.like('%all_%'))).\
            filter_by(source='view').\
            group_by(Rank.loc)
        self.day_count_by_country = {}
        for country_day in country_days:
            s = self.clean_loc(country_day[0])
            self.day_count_by_country[s] = country_day[1]
        return self.day_count_by_country
    
    def get_count_by_loc(self):
        '''
        Returns a dictionary that maps location to a map of video_id to number of rankings (ie. days)
        '''
        try:
            return self.count_by_loc
        except AttributeError:
            pass
        # Query ranks for all videos
        ranks = self.session.query(Rank.video_id, Rank.loc, sqlalchemy.sql.func.count('*').label('entries')).\
            filter(sqlalchemy.not_(Rank.loc.like('%all_%'))).\
            filter_by(source='view').\
            group_by(Rank.video_id, Rank.loc)
        
        # Create dict with counts (location -> video id -> count)
        self.count_by_loc = {}
        for rank in ranks:
            videos = self.count_by_loc.get(self.clean_loc(rank[1]), {})
            videos[rank[0]] = rank[2]
            self.count_by_loc[self.clean_loc(rank[1])] = videos
        return self.count_by_loc

    def get_videos(self):
        '''
        A set of all the videos we care about
        '''
        try:
            return self.videos
        except AttributeError:
            pass
        return set(video_id for by_vid in self.get_count_by_loc().values() for video_id in by_vid.keys())
    
    def get_locs(self):
        '''
        A set of all the locations we care about
        '''
        try:
            return self.locs
        except AttributeError:
            pass
        self.locs = set(self.get_count_by_loc().keys())
        return self.locs
    
    def get_idf(self):
        '''
        Return dict mapping countries to their inverse document frequency (with countries for "documents")
        '''
        try:
            return self.idf
        except AttributeError:
            pass
        count_by_loc = self.get_count_by_loc()
        videos = self.get_videos()
        locs = self.get_locs()
        self.idf = dict((video_id, math.log(len(locs) / sum([1 for l in locs if count_by_loc[l].get(video_id, 0) > 0]))) for video_id in videos)
        return self.idf

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

    def get_videos_without_metadata(self, count):
        return self.session.query(Rank.video_id).\
            filter(sqlalchemy.not_(Rank.loc.like('%all_%'))).\
            filter_by(source='view').\
            outerjoin(Video).\
            group_by(Rank.video_id).\
            having(sqlalchemy.sql.func.count(Video.id)==0).\
            limit(count)
