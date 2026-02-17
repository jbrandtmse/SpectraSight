Class SpectraSight.Util.Setup [ Abstract ]
{

/// Create or update the /api web application on IRIS
/// Configures the REST dispatch class, namespace, and authentication
/// Must switch to %SYS namespace to access Security.Applications
/// <p><var>pNamespace</var> — target namespace (default: "HSCUSTOM")</p>
ClassMethod ConfigureWebApp(pNamespace As %String = "HSCUSTOM") As %Status
{
    Set tSC = $$$OK
    Try {
        New $NAMESPACE
        Set $NAMESPACE = "%SYS"

        Set tName = "/api"
        Set tExists = ##class(Security.Applications).Exists(tName, .tApp)

        // AutheEnabled: 32=Password (AC #6 requires 401 without credentials)
        Set tAuthValue = 32
        If tExists {
            // Update existing application
            Set tProps("DispatchClass") = "SpectraSight.REST.Dispatch"
            Set tProps("NameSpace") = pNamespace
            Set tProps("Enabled") = 1
            Set tProps("AutheEnabled") = tAuthValue
            Set tProps("CSPZENEnabled") = 1
            Set tProps("InbndWebServicesEnabled") = 1
            Set tSC = ##class(Security.Applications).Modify(tName, .tProps)
        } Else {
            // Create new application
            Set tProps("DispatchClass") = "SpectraSight.REST.Dispatch"
            Set tProps("NameSpace") = pNamespace
            Set tProps("Enabled") = 1
            Set tProps("AutheEnabled") = tAuthValue
            Set tProps("CSPZENEnabled") = 1
            Set tProps("InbndWebServicesEnabled") = 1
            Set tSC = ##class(Security.Applications).Create(tName, .tProps)
        }
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Grant UnknownUser access to HSCUSTOM namespace for development.
/// WARNING: This is for LOCAL DEVELOPMENT ONLY. Do NOT run in production.
ClassMethod GrantUnknownUserAccess() As %Status
{
    Set tSC = $$$OK
    Try {
        New $NAMESPACE
        Set $NAMESPACE = "%SYS"
        // Get existing UnknownUser roles
        Set tSC = ##class(Security.Users).Get("UnknownUser", .tProps)
        If $$$ISERR(tSC) Quit
        Set tRoles = $GET(tProps("Roles"))
        // Add %DB_HSCUSTOM if not present
        If tRoles '[ "%DB_HSCUSTOM" {
            If tRoles '= "" Set tRoles = tRoles_","
            Set tRoles = tRoles_"%DB_HSCUSTOM"
        }
        // Add %SQL for SQL access
        If tRoles '[ "%SQL" {
            Set tRoles = tRoles_",%SQL"
        }
        Set tProps("Roles") = tRoles
        Set tSC = ##class(Security.Users).Modify("UnknownUser", .tProps)
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Enable unauthenticated access on the /api web app for development smoke testing.
/// This sets AutheEnabled = 96 (Password + Unauthenticated).
/// WARNING: LOCAL DEVELOPMENT ONLY. In production, use AutheEnabled = 32 (Password only).
ClassMethod EnableDevAccess() As %Status
{
    Set tSC = $$$OK
    Try {
        New $NAMESPACE
        Set $NAMESPACE = "%SYS"
        Set tProps("AutheEnabled") = 96
        Set tSC = ##class(Security.Applications).Modify("/api", .tProps)
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Create or verify the default "SpectraSight" project (Prefix="SS").
/// Assigns all existing tickets without a project to the default project.
/// Sets SequenceNumber on tickets that lack one (using their internal ID).
ClassMethod EnsureDefaultProject() As %Status
{
    Set tSC = $$$OK
    Try {
        // Check if default project already exists
        Set tStatement = ##class(%SQL.Statement).%New()
        Set tSC = tStatement.%Prepare("SELECT ID FROM SpectraSight_Model.Project WHERE Prefix = ?")
        If $$$ISERR(tSC) Quit
        Set tResult = tStatement.%Execute("SS")
        If tResult.%Next() {
            // Already exists
            Quit
        }

        // Find current max ticket ID
        Set tMaxId = 0
        Set tStmt2 = ##class(%SQL.Statement).%New()
        Set tSC = tStmt2.%Prepare("SELECT MAX(ID) AS MaxId FROM SpectraSight_Model.Ticket")
        If $$$ISERR(tSC) Quit
        Set tRes2 = tStmt2.%Execute()
        If tRes2.%Next() {
            Set tVal = tRes2.%Get("MaxId")
            If tVal '= "" Set tMaxId = +tVal
        }

        // Create the default project
        Set tProject = ##class(SpectraSight.Model.Project).%New()
        Set tProject.Name = "SpectraSight"
        Set tProject.Prefix = "SS"
        Set tProject.Owner = ""
        Set tProject.SequenceCounter = tMaxId
        Set tSC = tProject.%Save()
        If $$$ISERR(tSC) Quit

        Set tProjectId = tProject.%Id()

        // Assign all unassigned tickets to the default project
        Set tStmt3 = ##class(%SQL.Statement).%New()
        Set tSC = tStmt3.%Prepare("UPDATE SpectraSight_Model.Ticket SET Project = ? WHERE Project IS NULL")
        If $$$ISOK(tSC) {
            Do tStmt3.%Execute(tProjectId)
        }

        // Set SequenceNumber on tickets that lack one (use internal ID)
        Set tStmt4 = ##class(%SQL.Statement).%New()
        Set tSC = tStmt4.%Prepare("SELECT ID FROM SpectraSight_Model.Ticket WHERE SequenceNumber IS NULL OR SequenceNumber = 0")
        If $$$ISOK(tSC) {
            Set tRes4 = tStmt4.%Execute()
            While tRes4.%Next() {
                Set tTicketId = tRes4.%Get("ID")
                Set tTicket = ##class(SpectraSight.Model.Ticket).%OpenId(tTicketId)
                If tTicket '= "" {
                    Set tTicket.SequenceNumber = +tTicketId
                    Set tSC = tTicket.%Save()
                    If $$$ISERR(tSC) {
                        Set ^ClaudeDebug("Setup", "EnsureDefaultProject", "TicketSaveError", tTicketId) = $System.Status.GetErrorText(tSC)
                    }
                }
            }
        }

    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Diagnostic: check the /api web app configuration
ClassMethod CheckWebApp() As %String
{
    Set tResult = ""
    Try {
        New $NAMESPACE
        Set $NAMESPACE = "%SYS"
        Set tSC = ##class(Security.Applications).Get("/api", .tP)
        If $$$ISOK(tSC) {
            Set tResult = "Auth="_$GET(tP("AutheEnabled"))_"; NS="_$GET(tP("NameSpace"))_"; DC="_$GET(tP("DispatchClass"))_"; EN="_$GET(tP("Enabled"))
        } Else {
            Set tResult = "ERROR: "_$System.Status.GetErrorText(tSC)
        }
        // Check system auth
        Set tSC2 = ##class(Security.System).Get("",.tSys)
        If $$$ISOK(tSC2) {
            Set tResult = tResult_"; SysAuth="_$GET(tSys("AutheEnabled"))
        }
        // Check what auth the /api/atelier app uses (working example)
        Set tSC3 = ##class(Security.Applications).Get("/api/atelier", .tA)
        If $$$ISOK(tSC3) {
            Set tResult = tResult_"; AtelierAuth="_$GET(tA("AutheEnabled"))
        }
        // Check /csp/sys
        Set tSC4 = ##class(Security.Applications).Get("/csp/sys", .tC)
        If $$$ISOK(tSC4) {
            Set tResult = tResult_"; CspSysAuth="_$GET(tC("AutheEnabled"))
        }
    }
    Catch ex {
        Set tResult = "CATCH: "_ex.DisplayString()
    }
    Quit tResult
}

}
