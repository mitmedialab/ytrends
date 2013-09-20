import json

class Mock(object):

    def get_viewable(self):
        viewable = '{"wfcWvuugR74": 1, "bmSJ6reR6Ok": 1, "kkbnnace_cE": 1, "N6zixMk7gnQ": 1, "sJxrzw61vUo": 1, "fJwMfYBuMus": 1, "cqkXNwHm5OI": 1, "oB9JpI_JlAw": 1, "2ubqYcaALh8": 1, "yvrIDtmm5mg": 1, "kwbwSMIetlg": 1, "eLmN9jMsfWw": 1, "lL9NeyAa6jY": 1, "0_jthC56kaI": 1, "lI_xr4xX0Kg": 1, "oFZeVDyhzOQ": 1, "oxSvhWymBA8": 1, "wqks_R90ykI": 1, "ghkfwTT4NhQ": 1, "ReYu9PncAf0": 1, "cKNZ2r-UwBE": 1, "RX8vPSCgjB4": 1, "VRQuoH0rfuA": 1, "nYPKBtrdWKk": 1, "zQONpKVHfbU": 1, "H-sr2hg5TJw": 1, "7EqUip_pIfw": 1, "OKkUFddlg8U": 1, "hvliJvYaP8k": 1, "rLWipm5kHgw": 1, "IK3bji7dPSI": 1, "0cq-n41KDjY": 1, "CXK83f0vvmE": 1, "ylP4DDwXZb8": 1, "z910kbn_sag": 1, "OctTk3zxPmQ": 1, "RgIUIOf3Vz0": 1, "7YrqPDOAToQ": 1, "YhYbyQwcGz8": 1, "8W0gagVq8nI": 1, "INmtQXUXez8": 1, "59s25NxD32M": 1, "9PrNn3SSrVg": 1, "BmOpD46eZoA": 1, "SFtqkZ2IfeM": 1, "S-eIkHfSFjs": 1, "vHh3ADEwGZk": 1, "CevxZvSJLk8": 1, "V-Qu3qTAWhw": 1, "BTUv7p3XcjY": 0, "IkjO_0zTJsU": 1}'
        return json.loads(viewable)
    
    def get_day_count_by_country(self):
        day_count_by_country = '{"usa": 2, "are": 2, "nga": 2}'
        return json.loads(day_count_by_country)
    
    def get_count_by_loc(self):
        count_by_loc = '{"usa": {"VRQuoH0rfuA": 1, "YhYbyQwcGz8": 1, "2ubqYcaALh8": 1, "H-sr2hg5TJw": 1, "lI_xr4xX0Kg": 1, "7EqUip_pIfw": 1, "9PrNn3SSrVg": 2, "ghkfwTT4NhQ": 1, "oFZeVDyhzOQ": 1, "rLWipm5kHgw": 2, "SFtqkZ2IfeM": 1, "S-eIkHfSFjs": 1, "vHh3ADEwGZk": 1, "CevxZvSJLk8": 1, "z910kbn_sag": 1, "BTUv7p3XcjY": 2, "wqks_R90ykI": 1}, "are": {"8W0gagVq8nI": 1, "wfcWvuugR74": 1, "0_jthC56kaI": 1, "bmSJ6reR6Ok": 1, "V-Qu3qTAWhw": 1, "ReYu9PncAf0": 1, "oxSvhWymBA8": 1, "sJxrzw61vUo": 1, "cqkXNwHm5OI": 1, "BmOpD46eZoA": 1, "IK3bji7dPSI": 1, "ylP4DDwXZb8": 1, "kkbnnace_cE": 1, "kwbwSMIetlg": 1, "yvrIDtmm5mg": 1, "cKNZ2r-UwBE": 1, "RX8vPSCgjB4": 1, "CevxZvSJLk8": 2, "IkjO_0zTJsU": 1}, "nga": {"lL9NeyAa6jY": 1, "nYPKBtrdWKk": 1, "zQONpKVHfbU": 1, "INmtQXUXez8": 1, "59s25NxD32M": 1, "OKkUFddlg8U": 1, "oB9JpI_JlAw": 1, "hvliJvYaP8k": 1, "0cq-n41KDjY": 1, "fJwMfYBuMus": 2, "N6zixMk7gnQ": 1, "CXK83f0vvmE": 2, "CevxZvSJLk8": 1, "eLmN9jMsfWw": 1, "OctTk3zxPmQ": 2, "RgIUIOf3Vz0": 1, "7YrqPDOAToQ": 1}}'
        return json.loads(count_by_loc)

    def  get_locs(self):
    	return set(self.get_day_count_by_country().keys())