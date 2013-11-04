import itertools

import gensim

import ytrends.stats

class ClusterStats(ytrends.stats.Stats):
    def get_country_corpus(self):
        '''
        Return a 3-tuple with a gensim corpus, dictionary, and map from numeric
        id to country.  The "documents" in the corpus are countries.
        '''
        # Create a list of country-documents with videos as terms
        # e.g.: [['BftrqE2CQiQ', 'QFs3PIZb3js'], ['jofNR_WkoCE', 'My2FRPA3Gf8']]
        # See http://radimrehurek.com/gensim/tut1.html
        return self._counts_to_country_corpus(self.get_count_by_loc())
    
    def _counts_to_country_corpus(self, count_by_loc):
        '''
        Return a 3-tuple with a gensim corpus, dictionary, and map from nmeric
        id to country.  The "documents" in the corpus are countries.
        '''
        docs = []
        doc_map = {}
        for loc, count_by_id in count_by_loc.iteritems():
            doc_map[loc] = len(docs)
            docs.append(sum([[vid_id]*count for vid_id, count in count_by_id.iteritems()], []))
        # Remove videos that appear in only one country
        id_counts = {}
        for loc, count_by_ids in count_by_loc.iteritems():
            for vid_id in count_by_ids.keys():
                id_counts[vid_id] = id_counts.get(vid_id, 0) + 1
        docs = [[term for term in doc if id_counts[term] > 1] for doc in docs]
        # Create dictionary and corpus
        dictionary = gensim.corpora.Dictionary(docs)
        corpus = [dictionary.doc2bow(doc) for doc in docs]
        return (corpus, dictionary, doc_map)
    
    def get_cv_country_corpus(self, fold_count=3):
        folds = self.get_cv_count_by_loc(fold_count)
        corpus_folds = []
        for i in range(0, fold_count):
            corpus_folds.append((self._counts_to_country_corpus(folds[i][0]), self._counts_to_country_corpus(folds[i][1])))
        return corpus_folds
    
    