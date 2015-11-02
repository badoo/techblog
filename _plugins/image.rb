Jekyll::Hooks.register :posts, :pre_render do |page, payload|
  url = payload['page']['url']
  payload['page']['imgdir'] = '/images/' + url.split('/').pop.to_s
  payload['page']['demodir'] = '/demo/' + url.split('/').pop.to_s
  payload['page']['filesdir'] = '/files/' + url.split('/').pop.to_s
end