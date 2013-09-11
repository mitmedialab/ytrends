from operator import itemgetter
import dateutil.parser
import datetime
import ConfigParser
import logging
import sys
import json
import sqlalchemy
import ytrends.locations as locs
from ytrends.db import *
import gdata.youtube
import gdata.youtube.service

# read in app config
CONFIG_FILENAME = 'app.config'
MAX_VIDEOS_TO_PROCESS = 100
config = ConfigParser.ConfigParser()
config.read(CONFIG_FILENAME)

# setup logging
logging.basicConfig(filename='ytrends.log',level=logging.DEBUG)
log = logging.getLogger('ytrends')
log.info("---------------------------------------------------------------------------")

# init the connection to the database
engine = sqlalchemy.create_engine("sqlite:///"+config.get('db','path'), echo=True)
Session = sqlalchemy.orm.sessionmaker(bind=engine)
session = Session()
log.info("Connected to db at "+config.get('db','path'))

# connect to youtube api
yt_service = gdata.youtube.service.YouTubeService()
yt_service.ssl = True
yt_service.developer_key = config.get('youtube','developer_key')
yt_service.client_id = config.get('youtube','client_id')
log.info("Connected to youtube")

# find all videos that don't have metadata
new_videos = session.query(Rank.video_id).\
    filter(sqlalchemy.not_(Rank.loc.like('%all_%'))).\
    filter_by(source='view').\
    outerjoin(Video).\
    group_by(Rank.video_id).\
    having(sqlalchemy.sql.func.count(Video.id)==0).\
    limit(MAX_VIDEOS_TO_PROCESS)    

for video in new_videos:
    video_id = video[0]
    viewable = None
    # query youtube
    try:
        log.info("Fetching "+video_id)
        entry = yt_service.GetYouTubeVideoEntry(video_id=video_id)
        #PrintEntryDetails(entry)
        viewable = True
    except gdata.service.RequestError:
        viewable = False
    # save metadata
    now = datetime.datetime.now()
    print now
    v = Video(id=video_id)
    v.viewable = viewable
    v.created_at = now
    v.updated_at = now
    if v.viewable:
        v.title =  unicode(entry.media.title.text, "utf-8")
        if entry.media.description.text is not None:
            v.description = unicode(entry.media.description.text, "utf-8")
        v.category = unicode(entry.media.category[0].text, "utf-8")
        if entry.media.keywords.text is not None:
            v.tags = unicode(entry.media.keywords.text, "utf-8")
        if entry.geo is not None:
            v.geo = unicode(' '.join(str(s) for s in entry.geo.location()), "utf-8")
        v.duration = entry.media.duration.seconds
        v.views = entry.statistics.view_count
        if entry.rating is not None:
            v.rating = entry.rating.average
        v.published_date = dateutil.parser.parse(entry.published.text)
    session.add(v)
    session.commit()

def PrintEntryDetails(entry):
  print 'Video title: %s' % entry.media.title.text
  print 'Video published on: %s ' % entry.published.text
  print 'Video description: %s' % entry.media.description.text
  print 'Video category: %s' % entry.media.category[0].text
  print 'Video tags: %s' % entry.media.keywords.text
  print 'Video watch page: %s' % entry.media.player.url
  print 'Video flash player URL: %s' % entry.GetSwfUrl()
  print 'Video duration: %s' % entry.media.duration.seconds

  # non entry.media attributes
  print 'Video geo location: %s' % entry.geo
  print 'Video view count: %s' % entry.statistics.view_count
  print 'Video rating: %s' % entry.rating.average

  # show alternate formats
  for alternate_format in entry.media.content:
    if 'isDefault' not in alternate_format.extension_attributes:
      print 'Alternate format: %s | url: %s ' % (alternate_format.type,
                                                 alternate_format.url)

  # show thumbnails
  for thumbnail in entry.media.thumbnail:
    print 'Thumbnail url: %s' % thumbnail.url

log.info("Done!")
