import logging, ConfigParser
from flask import Flask, render_template

app = Flask(__name__)

# setup logging
logging.basicConfig(filename='server.log',level=logging.DEBUG)
log = logging.getLogger('server')
log.info("---------------------------------------------------------------------------")

@app.route("/")
def index():
    return render_template("base.html")

if __name__ == "__main__":
    app.debug = True
    app.run()
    log.info("Started Server")