def dictToList(d, key_name='key', value_name='value'):
    return [{key_name:k, value_name:v} for k,v in d.iteritems()]
