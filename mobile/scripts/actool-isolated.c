#include <libgen.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static const char *actool =
    "/Applications/Xcode.app/Contents/Developer/usr/bin/actool";

int main(int argc, char **argv) {
    int compile = 0;
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--compile") == 0) {
            compile = 1;
            break;
        }
    }
    if (!compile) {
        execv(actool, argv);
        perror("actool");
        return 127;
    }
    char owned[4096];
    snprintf(owned, sizeof owned, "%s", argv[0]);
    char *dir = dirname(owned);
    char python[4096];
    snprintf(python, sizeof python, "%s/actool-isolated.py", dir);
    argv[0] = python;
    execv(python, argv);
    perror("actool-isolated");
    return 127;
}
