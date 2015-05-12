module Jekyll

    class LessCssFile < StaticFile
        def write(dest)
            # do nothing
        end
    end

    class LessGenerator < Generator

        safe true
        priority :low

        # http://stackoverflow.com/questions/2108727/which-in-ruby-checking-if-program-exists-in-path-from-ruby
        def which(cmd)
            exts = ENV['PATHEXT'] ? ENV['PATHEXT'].split(';') : ['']
            ENV['PATH'].split(File::PATH_SEPARATOR).each do |path|
                exts.each { |ext|
                    exe = File.join(path, "#{cmd}#{ext}")
                    return exe if File.executable? exe
                }
            end
            return nil
        end

        def generate(site)

            # put logs on a new line
            puts

            # if less is not available on the PATH then set use_lessjs to true
            if which('lessc').nil? then
                site.config['use_lessjs'] = true
                puts 'LessGenerator: less is not installed.'
                return
            end

            puts 'LessGenerator: compiling...'

            src_root = site.config['source']
            dest_root = site.config['destination']
            less_ext = /\.less$/i

            # static_files have already been filtered against excludes, etc.
            site.static_files.each do |sf|

                next if not sf.path =~ less_ext

                less_path = sf.path
                css_path = less_path.gsub(less_ext, '.css').gsub(src_root, dest_root)
                css_dir = File.dirname(css_path)
                css_dir_relative = css_dir.gsub(dest_root, '')
                css_name = File.basename(css_path)

                compress = site.config['compress_less'] ? '--compress' : ''

                FileUtils.mkdir_p(css_dir)

                begin
                    command = [
                        'lessc',
                        less_path,
                        css_path,
                        compress
                    ].join(' ')

                    puts command

                    `#{command}`

                    raise "LessGenerator: compilation error" if $?.to_i != 0
                end

                site.static_files << LessCssFile.new(site, site.source, css_dir_relative, css_name)

            end # end static_files.each

        end # end generate

    end #end LessGenerator

end # end module
