class Jekyll::Post
	alias :to_liquid_without_comments :to_liquid

	def to_liquid()
		data = to_liquid_without_comments()
		data['imgdir'] = '/images/' + data['url'].split('/').pop
		data['demodir'] = '/demo/' + data['url'].split('/').pop
		data['filesdir'] = '/files/' + data['url'].split('/').pop
		data
	end
end