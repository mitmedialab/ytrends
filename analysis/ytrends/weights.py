from __future__ import division
import math

def percentage (source_counts, target_counts):
    intersection = set(source_counts.keys()).\
        intersection(set(target_counts.keys()))
    return float(len(intersection)) / float(len(source_counts))

def bhattacharyya (source_counts, target_counts, source_day_counts, target_day_counts):
    # Calculate intersection and union
    intersection = set(source_counts.keys()).\
        intersection(set(target_counts.keys()))
    union = set(source_counts.keys()).\
        union(set(target_counts.keys()))
    # Calculate weights for each video
    normalization = 1 / 10 # 10 videos per day
    video_weights = [
        (v, normalization * math.sqrt(
            source_counts[v]/source_day_counts
            * target_counts[v]/target_day_counts)
        ) for v in intersection
    ]
    # Calculate overall weight between source and target
    weight = sum(w[1] for w in video_weights)
    return (weight, video_weights)
