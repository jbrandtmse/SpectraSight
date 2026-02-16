Class SpectraSight.REST.ProjectHandler [ Abstract ]
{

/// GET /api/projects - List all projects
ClassMethod ListProjects() As %Status
{
    Set tSC = $$$OK
    Try {
        Set tStatement = ##class(%SQL.Statement).%New()
        Set tSC2 = tStatement.%Prepare("SELECT ID FROM SpectraSight_Model.Project ORDER BY Prefix")
        If $$$ISERR(tSC2) {
            Set tSC = ##class(SpectraSight.REST.Response).ServerError("Failed to prepare project query")
            Quit
        }

        Set tResult = tStatement.%Execute()
        Set tArray = ##class(%DynamicArray).%New()

        While tResult.%Next() {
            Set tProject = ##class(SpectraSight.Model.Project).%OpenId(tResult.%Get("ID"))
            If tProject '= "" {
                Set tObj = ..BuildProjectResponse(tProject)
                Do tArray.%Push(tObj)
            }
        }

        Set tSC = ##class(SpectraSight.REST.Response).Success(tArray)
    }
    Catch ex {
        Set tSC = ##class(SpectraSight.REST.Response).ServerError("An unexpected error occurred while listing projects")
    }
    Quit tSC
}

/// POST /api/projects - Create a new project
ClassMethod CreateProject() As %Status
{
    Set tSC = $$$OK
    Try {
        // Guard against empty/missing request body
        If (%request.Content = "") || ('$ISOBJECT(%request.Content)) {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Request body is required")
            Quit
        }

        Set tBody = ##class(%DynamicObject).%FromJSON(%request.Content)
        Set tName = tBody.%Get("name")
        Set tPrefix = tBody.%Get("prefix")

        // Validate required fields
        If (tName = "") || (tName = $CHAR(0)) {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("name is required")
            Quit
        }
        If $LENGTH(tName) > 255 {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("name exceeds maximum length of 255 characters")
            Quit
        }
        If (tPrefix = "") || (tPrefix = $CHAR(0)) {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("prefix is required")
            Quit
        }

        // Uppercase the prefix
        Set tPrefix = $ZCONVERT(tPrefix, "U")

        // Create new project
        Set tProject = ##class(SpectraSight.Model.Project).%New()
        Set tProject.Name = tName
        Set tProject.Prefix = tPrefix
        If tBody.%IsDefined("owner") {
            Set tProject.Owner = tBody.%Get("owner")
        }

        // Save - the model's %OnBeforeSave validates prefix format
        Set tSC2 = tProject.%Save()
        If $$$ISERR(tSC2) {
            // Check for unique constraint violation on prefix
            Set tErrorText = $System.Status.GetErrorText(tSC2)
            If tErrorText [ "unique" || (tErrorText [ "Unique") || (tErrorText [ "UNIQUE") || (tErrorText [ "PrefixIdx") {
                Set tSC = ##class(SpectraSight.REST.Response).BadRequest("A project with prefix '"_tPrefix_"' already exists")
                Quit
            }
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Failed to save project: "_tErrorText)
            Quit
        }

        Set tResponse = ..BuildProjectResponse(tProject)
        Set tSC = ##class(SpectraSight.REST.Response).Created(tResponse)
    }
    Catch ex {
        Set tSC = ##class(SpectraSight.REST.Response).ServerError("An unexpected error occurred while creating the project")
    }
    Quit tSC
}

/// GET /api/projects/:id - Get a single project
ClassMethod GetProject(pId As %String) As %Status
{
    Set tSC = $$$OK
    Try {
        Set tProject = ##class(SpectraSight.Model.Project).%OpenId(pId)
        If tProject = "" {
            Set tSC = ##class(SpectraSight.REST.Response).NotFound("Project not found")
            Quit
        }

        Set tResponse = ..BuildProjectResponse(tProject)
        Set tSC = ##class(SpectraSight.REST.Response).Success(tResponse)
    }
    Catch ex {
        Set tSC = ##class(SpectraSight.REST.Response).ServerError("An unexpected error occurred while retrieving the project")
    }
    Quit tSC
}

/// PUT /api/projects/:id - Update a project
ClassMethod UpdateProject(pId As %String) As %Status
{
    Set tSC = $$$OK
    Try {
        Set tProject = ##class(SpectraSight.Model.Project).%OpenId(pId)
        If tProject = "" {
            Set tSC = ##class(SpectraSight.REST.Response).NotFound("Project not found")
            Quit
        }

        // Guard against empty/missing request body
        If (%request.Content = "") || ('$ISOBJECT(%request.Content)) {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Request body is required")
            Quit
        }

        Set tBody = ##class(%DynamicObject).%FromJSON(%request.Content)

        // Prefix is immutable after creation
        If tBody.%IsDefined("prefix") {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Prefix is immutable after creation")
            Quit
        }

        // Validate at least one updatable field is provided
        If 'tBody.%IsDefined("name") && 'tBody.%IsDefined("owner") {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("At least one field (name or owner) must be provided")
            Quit
        }

        // Update name if provided
        If tBody.%IsDefined("name") {
            Set tNewName = tBody.%Get("name")
            If $LENGTH(tNewName) > 255 {
                Set tSC = ##class(SpectraSight.REST.Response).BadRequest("name exceeds maximum length of 255 characters")
                Quit
            }
            Set tProject.Name = tNewName
        }

        // Update owner if provided
        If tBody.%IsDefined("owner") {
            Set tProject.Owner = tBody.%Get("owner")
        }

        Set tSC2 = tProject.%Save()
        If $$$ISERR(tSC2) {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Failed to save project: "_$System.Status.GetErrorText(tSC2))
            Quit
        }

        Set tResponse = ..BuildProjectResponse(tProject)
        Set tSC = ##class(SpectraSight.REST.Response).Success(tResponse)
    }
    Catch ex {
        Set tSC = ##class(SpectraSight.REST.Response).ServerError("An unexpected error occurred while updating the project")
    }
    Quit tSC
}

/// DELETE /api/projects/:id - Delete a project
ClassMethod DeleteProject(pId As %String) As %Status
{
    Set tSC = $$$OK
    Try {
        Set tProject = ##class(SpectraSight.Model.Project).%OpenId(pId)
        If tProject = "" {
            Set tSC = ##class(SpectraSight.REST.Response).NotFound("Project not found")
            Quit
        }

        // Cannot delete the default project
        If tProject.Prefix = "SS" {
            Set tSC = ##class(SpectraSight.REST.Response).Forbidden("Cannot delete the default project")
            Quit
        }

        // Check for existing tickets
        Set tStatement = ##class(%SQL.Statement).%New()
        Set tSC2 = tStatement.%Prepare("SELECT COUNT(*) AS cnt FROM SpectraSight_Model.Ticket WHERE Project = ?")
        If $$$ISERR(tSC2) {
            Set tSC = ##class(SpectraSight.REST.Response).ServerError("Failed to check ticket count")
            Quit
        }
        Set tResult = tStatement.%Execute(pId)
        Set tTicketCount = 0
        If tResult.%Next() {
            Set tTicketCount = tResult.%Get("cnt")
        }
        If tTicketCount > 0 {
            Set tSC = ##class(SpectraSight.REST.Response).Conflict("Cannot delete project with existing tickets")
            Quit
        }

        // Delete the project
        Set tSC2 = ##class(SpectraSight.Model.Project).%DeleteId(pId)
        If $$$ISERR(tSC2) {
            Set tSC = ##class(SpectraSight.REST.Response).ServerError("Failed to delete project: "_$System.Status.GetErrorText(tSC2))
            Quit
        }

        Set tSC = ##class(SpectraSight.REST.Response).SuccessNoContent()
    }
    Catch ex {
        Set tSC = ##class(SpectraSight.REST.Response).ServerError("An unexpected error occurred while deleting the project")
    }
    Quit tSC
}

/// Build a %DynamicObject response from a project object
ClassMethod BuildProjectResponse(pProject As SpectraSight.Model.Project) As %DynamicObject
{
    Set tObj = ##class(%DynamicObject).%New()
    Try {
        Do tObj.%Set("id", pProject.%Id(), "number")
        Do tObj.%Set("name", pProject.Name)
        Do tObj.%Set("prefix", pProject.Prefix)
        Do tObj.%Set("owner", pProject.Owner)
        Do tObj.%Set("sequenceCounter", pProject.SequenceCounter, "number")

        // Get ticket count
        Set tTicketCount = 0
        Set tStatement = ##class(%SQL.Statement).%New()
        Set tSC = tStatement.%Prepare("SELECT COUNT(*) AS cnt FROM SpectraSight_Model.Ticket WHERE Project = ?")
        If $$$ISOK(tSC) {
            Set tResult = tStatement.%Execute(pProject.%Id())
            If tResult.%Next() {
                Set tTicketCount = tResult.%Get("cnt")
            }
        }
        Do tObj.%Set("ticketCount", tTicketCount, "number")

        Do tObj.%Set("createdAt", pProject.CreatedAt)
        Do tObj.%Set("updatedAt", pProject.UpdatedAt)
    }
    Catch ex {
        Set ^ClaudeDebug("REST", "BuildProjectResponse", "error") = ex.DisplayString()
    }
    Quit tObj
}

}
