module Jekyll
    class Jekyll::Post
        alias :to_liquid_without_comments :to_liquid

        def to_liquid(attrs = ATTRIBUTES_FOR_LIQUID)
            data = to_liquid_without_comments(attrs)
            data['imgdir'] = '/images/' + data['url'].split('/').pop
            data['demodir'] = '/demo/' + data['url'].split('/').pop
            data['filesdir'] = '/files/' + data['url'].split('/').pop
            data
        end
    end
end