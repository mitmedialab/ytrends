import itertools

import gensim

import ytrends.stats

class ClusterStats(ytrends.stats.Stats):
    def get_corpus(self):
        '''
        Return a 2-tuple with a gensim dictionary and bag of words corpus.
        '''
        # Create list of word (video id) lists
        count_by_loc = self.get_count_by_loc()
        texts = [list(itertools.chain(*[[id]*count for id, count in count_by_loc[loc].iteritems()])) for loc in count_by_loc.keys()]
        # Remove videos that appear in only one country
        id_counts = {}
        for loc, videos in count_by_loc.iteritems():
            for id in videos.keys():
                id_counts[id] = id_counts.get(id, 0) + 1
        texts = [[word for word in text if id_counts[word] > 1] for text in texts]
        # Create dictionary and corpus
        dictionary = gensim.corpora.Dictionary(texts)
        corpus = [dictionary.doc2bow(text) for text in texts]
        return (dictionary, corpus)
    