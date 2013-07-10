
SRC_FILE = 'ytrends/data/locations.txt'
code_to_location_dict = None

def all():
    locs = _locations()
    return locs.values()

def get(ytrends_location_code):
    locs = _locations()
    return locs[ytrends_location_code]

def countries():
    locs = _locations().values()
    return [loc for loc in locs if loc.code=='--' or not loc.code.startswith('all_')]

def us_cities():
    locs = _locations().values()
    return [loc for loc in locs if loc.code.startswith('all_')]

def _locations():
    global code_to_location_dict
    if code_to_location_dict==None:
        file = open( SRC_FILE, "r" )
        code_to_location_dict = {}
        for line in file:
            code, name = line.split("|")
            code_to_location_dict[code] = Location(code,name)
    return code_to_location_dict

class Location():

    code = None
    name = None

    def __init__(self, code, name):
        self.code = code
        self.name = name

    def __repr__(self):
        return self.name
