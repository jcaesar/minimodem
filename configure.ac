AC_PREREQ([2.64])
AC_INIT([minimodem], [0.24], [kamal@whence.com])
AC_CONFIG_HEADERS([config.h])
AC_CONFIG_SRCDIR([src/Makefile.in])
AM_INIT_AUTOMAKE

VERSION=AC_PACKAGE_VERSION
AC_SUBST(VERSION)

# Program Checks
AC_PROG_CC

# Library Checks
AC_SEARCH_LIBS([lroundf], [m])

#   ALSA
AC_ARG_WITH([alsa], [AS_HELP_STRING([--without-alsa],
            [build without ALSA support])])
AS_IF([test "x$with_alsa" = "xno"], [
    use_alsa=0
], [
    use_alsa=1
    PKG_CHECK_MODULES(DEPS, [alsa])
])
AC_DEFINE_UNQUOTED([USE_ALSA], [$use_alsa],
                   [Define to 1 to enable ALSA support])

#   pulseaudio
AC_ARG_WITH([pulseaudio], AS_HELP_STRING([--without-pulseaudio],
            [build without pulseaudio support]))
AS_IF([test "x$with_pulseaudio" = "xno"], [
    use_pulseaudio=0
], [
    use_pulseaudio=1
    PKG_CHECK_MODULES(DEPS, [libpulse-simple])
])
AC_DEFINE_UNQUOTED([USE_PULSEAUDIO], [$use_pulseaudio],
                   [Define to 1 to enable pulseaudio support])

#   sndio
AC_ARG_WITH([sndio], AS_HELP_STRING([--without-sndio],
            [build without sndio support]))
AS_IF([test "x$with_sndio" = "xno"], [
    use_sndio=0
], [
    use_sndio=1
    AC_LANG_PUSH(C)
    AC_CHECK_LIB(sndio, sio_start)
])
AC_DEFINE_UNQUOTED([USE_SNDIO], [$use_sndio],
                   [Define to 1 to enable sndio support])

#   sndfile
AC_ARG_WITH([sndfile], AS_HELP_STRING([--without-sndfile],
            [build without sndfile support]))
AS_IF([test "x$with_sndfile" = "xno"], [
    use_sndfile=0
], [
    use_sndfile=1
    PKG_CHECK_MODULES(DEPS, [sndfile])
])
AC_DEFINE_UNQUOTED([USE_SNDFILE], [$use_sndfile],
                   [Define to 1 to enable sndfile support])

#   stdio
AC_ARG_WITH([stdio], AS_HELP_STRING([--without-stdio],
            [build without stdio support]))
AS_IF([test "x$with_stdio" = "xno"], [
    use_stdio=0
], [
    use_stdio=1
])
AC_DEFINE_UNQUOTED([USE_STDIO], [$use_stdio],
                   [Define to 1 to enable stdio support])

#   benchmarks
AC_ARG_WITH([benchmarks], AS_HELP_STRING([--disable-benchmarks],
            [build without internal benchmarks]))
AS_IF([test "x$with_benchmarks" = "xno"], [
    use_benchmarks=0
], [
    use_benchmarks=1
])
AC_DEFINE_UNQUOTED([USE_BENCHMARKS], [$use_benchmarks],
                   [Define to 1 to enable internal benchmarks])

AC_MSG_RESULT([
option summary:
    alsa           $with_alsa ($use_alsa)
    benchmarks     $with_benchmarks ($use_benchmarks)
    pulseaudio     $with_pulseaudio ($use_pulseaudio)
    sndfile        $with_sndfile ($use_sndfile)
    stdio          $with_stdio ($use_stdio)
    sndio          $with_sndio ($use_sndio)
])

AC_SUBST([auto_find_tests], ['$(sort $(wildcard *.test))'])

AC_CONFIG_FILES([Makefile src/Makefile src/minimodem.1 tests/Makefile])
AC_OUTPUT
