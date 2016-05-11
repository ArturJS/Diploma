use locale;
use encoding "cp866";
{
     print "Имя папки: "; my $folder_name=<>;
     chomp($folder_name);
     my @files = `chcp 866 & attrib $folder_name\\*.pl`;
     if (substr($files[1],0,15) eq 'Не найден путь:') {
          print "Путь не найден. Попробуйте еще.\n";
          redo;
     }
     elsif (substr($files[1],0,15) eq 'Не найден файл:') {
          print "Папка не содержит файлов .txt .\n";
          last;
     }
     else {
          foreach my $file (@files[1 .. $#files]){
               my $file_name = substr($file, 11);
               chomp($file_name);
               open(FH,"<$file_name") or die $!;
               my %hash = ();
               foreach $chunk (<FH>){
                    my @words = $chunk =~ /([\@\%\$][a-zA-Z_0-9]+[\[\{]?)/g;
                    foreach my $word (@words) {
                         $word = "\$".substr($word, 1) 
                            if (substr($word, 0, 1) eq '@' && 
                                substr($word, -1) eq '[');
                         $word = "\$".substr($word, 1)."[" 
                            if (substr($word, 0, 1) eq '@');
                         $word = "\$".substr($word, 1)."{" 
                            if (substr($word, 0, 1) eq '%');
                         $hash{$word}++;
                    };
               };
               my @xs = keys %hash;
               print @xs;
               close(FH);
               my $ans = scalar(@xs);
               print "$file_name : $ans\n";
          }
     }
}