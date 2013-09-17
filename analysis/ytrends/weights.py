from __future__ import division
import math

class Weight(object):
    def __init__(self, stats):
        self.stats = stats
        
    def get_intersection(self, source, target):
        count_by_loc = self.stats.get_count_by_loc()
        intersection = set(count_by_loc[source].keys()).\
            intersection(set(count_by_loc[target].keys()))
        return intersection
    
    def get_union(self, source, target):
        count_by_loc = self.stats.get_count_by_loc()
        union = set(count_by_loc[source].keys()).\
            union(set(count_by_loc[target].keys()))
        return union
    
    def get_percentage (self, source, target):
        intersection = self.get_intersection(source, target)
        return float(len(intersection)) / float(len(self.stats.get_count_by_loc()[source]))

    def get_weights (self, method):
        viewable = self.stats.get_viewable()
        results = {}
        for source in self.stats.get_locs():
            results[source] = results.get(source, {})
            for target in self.stats.get_locs():
                if source == target:
                    continue
                # Calculate naive count of videos in common
                weight, video_weights = method(source, target)
                if weight > 0:
                    results[source][target] = (weight, video_weights)
        return results
    
    def count (self, source, target):
        # Calculate naive count of videos in common
        count_by_loc = self.stats.get_count_by_loc()
        intersection = self.get_intersection(source, target)
        weight = len(intersection)
        video_weights = [(v, min(count_by_loc[source][v], count_by_loc[target][v])) for v in intersection]
        return (weight, video_weights)
    
    def jaccard (self, source, target):
        # Calculate jaccard coefficient |A intersect B| / |A union B|
        count_by_loc = self.stats.get_count_by_loc()
        union_weights = [max(count_by_loc[source].get(v, 0), count_by_loc[target].get(v, 0)) for v in self.get_union(source, target)]
        normalization = 1 / sum(union_weights)
        video_weights = [(v, normalization*min(count_by_loc[source][v], count_by_loc[target][v])) for v in self.get_intersection(source, target)]
        weight = sum([w[1] for w in video_weights])
        return (weight, video_weights)

    def bhattacharyya (self, source, target):
        # Calculate intersection and counts
        count_by_loc = self.stats.get_count_by_loc()
        day_count_by_country = self.stats.get_day_count_by_country()
        intersection = self.get_intersection(source, target)
        # Calculate weights for each video
        normalization = 1 / 10 # 10 videos per day
        video_weights = [
            (v, normalization * math.sqrt(
                count_by_loc[source][v]/day_count_by_country[source]
                * count_by_loc[target][v]/day_count_by_country[target])
            ) for v in intersection
        ]
        weight = sum([w[1] for w in video_weights])
        return (weight, video_weights)
