import dateutil.parser, datetime, time
import ConfigParser, logging, sys
import sqlalchemy
import gdata.youtube, gdata.youtube.service

from ytrends.db import *
from ytrends import stats

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
stats = stats.Stats("mysql+mysqldb://"+config.get('db','user')+":"+config.get('db','pass')+
    "@"+config.get('db','host')+"/"+config.get('db','name')+"?charset=utf8")
log.info("Connected to db")

# connect to youtube api
yt_service = gdata.youtube.service.YouTubeService()
yt_service.ssl = True
yt_service.developer_key = config.get('youtube','developer_key')
yt_service.client_id = config.get('youtube','client_id')
log.info("Connected to youtube")

# find videos that don't have metadata
new_videos = stats.get_videos_without_metadata(MAX_VIDEOS_TO_PROCESS)

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
    # save metadata to db
    now = datetime.datetime.now()
    v = Video(id=video_id)
    v.viewable = viewable
    v.created_at = now
    v.updated_at = now
    if v.viewable:
        v.title =  unicode(entry.media.title.text, "utf-8")
        if entry.media.description.text is not None:
            v.description = unicode(entry.media.description.text, "utf-8")
        if entry.media.category is not None:
            v.category = unicode(entry.media.category[0].text, "utf-8")
        if entry.media.keywords.text is not None:
            v.tags = unicode(entry.media.keywords.text, "utf-8")
        if entry.geo is not None:
            v.geo = unicode(' '.join(str(s) for s in entry.geo.location()), "utf-8")
        if entry.media.duration is not None:
            v.duration = entry.media.duration.seconds
        if entry.statistics is not None:
            v.views = entry.statistics.view_count
        if entry.rating is not None:
            v.rating = entry.rating.average
        if entry.published is not None:
            v.published_date = dateutil.parser.parse(entry.published.text)
    stats.session.add(v)
    stats.session.commit()
    log.info("  saved"+video_id)
    time.sleep(1)

log.info("Done!")
