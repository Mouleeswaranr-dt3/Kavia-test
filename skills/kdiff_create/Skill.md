---
name: kdiff_create
description: Instructions for creating a kdiff (knowledge about differences between baseline and new codebases) that can be subsequently used for deep queries using a kdiff query skill
owner: system
source_ecosystem: kavia-system
tools:
  - KDiffCreationTools
slash_command:
  command: kdiff-create
  enabled: true
---

# kdiff_create

=== Kdiff_create prompt ===
-use the KDiffCreationTools_kdiff_create tool to create a specialized kdiff for extracting useful information
about the differences between baseline and new versions of a set of codebases.  If the performance of your overall
task requires or would benefit from detailed information about differences between codebase versions you should
create a kdiff using this skill and then use the kdiff by employing a kdiff_query skill.  To create a kdiff you
would invoke the KDiffCreationTools_kdiff_create tool passing an arbitrary unique identifier string for the "name"
argument an array of baseline codebase specifiers for the "baseline_code" argument, and an array of new codebase
specifiers for the "new_code" argument.  Each codebase specifier in the "baseline_code" and "new_code" arrays 
consists of "name", "location", and "branch" values.  The "name" is an identifer for the codebase and must be
unique within each array (baseline and new), but must match ONE name in the other array.  For example, in the
baseline array you cannot have two specifiers using the name "ABC" but if the baseline array has a specifier
with the name ABC then the new array must also have a specifier using "ABC" so that each specifier in baseline
has a specifier in new.  A "location" may be a valid git repository URI suitable for use with git clone or an
existing filesystem path.  The special value "CURRENT" can only be used as the location for a codebase specifier
in the "new_code" array and means the version of that codebase currently being operated on in this session
(code generation, code maintenance, document creation, code query, etc).

For a git repository URI, "branch" must identify the branch that should be cloned.  If a specific branch is
required, always provide a valid git repository URI rather than a filesystem path.  A filesystem location is
used exactly as it already exists, so its branch is conceptually unknown or unspecified and the "branch" value
has no effect; set it to the required sentinel "ANY".  For a specifier whose location is "CURRENT", set "branch"
to "CURRENT".  Every filesystem path must already exist, and the baseline and new specifiers for a codebase must
not resolve to the same source.

There are two classes of cases for the use of KDiffCreationTools_kdiff_create: direct user request, agent directed
plan.  If a user has explicitly requested the creation of a kdiff the creation the creation should be asynchronous
so as not to block user interaction.  If the kdiff creation is a step in an agent generated plan (for example by
the CodeReviewAgent) the creation should be synchronous so that the kdiff is immediately available for use by the
agent after the KDiffCreationTools_kdiff_create tool call returns.  For asynchronous operation set "blocking"
argument to False and for synchronous operation set "blocking" to True.

Asynchronous operation ("blocking" = False):
When you invoke KDiffCreationTools_kdiff_create you will get a synchronous response that either indicates
failure or success.  If the response is success it means the process of kdiff creation has successfully
done and will complete asynchronously later.  When the asynchronous kdiff creation completes the
user will receive a message indicting it is ready for use, and future agents will observe that a new skill
becomes available to them: "kdiff-{name}" where the name is the value passed as "name" for the kdiff creation
tool call.  Future agents can then use this new skill to perform detailed queries about differences between
the codebase versions.

Synchronous operation ("blocking" = True):
When you invoke KDiffCreationTools_kdiff_create you will get a synchronous response that either indicates
failure or success.  If the response is success it means the process of kdiff creation has completed and the
kdiff is ready for use.
